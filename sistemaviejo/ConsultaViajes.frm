VERSION 5.00
Object = "{D18BBD1F-82BB-4385-BED3-E9D31A3E361E}#1.0#0"; "kewlbuttonz.ocx"
Begin VB.Form ConsultaViajes 
   BackColor       =   &H80000007&
   Caption         =   "Consulta Viaje"
   ClientHeight    =   5025
   ClientLeft      =   60
   ClientTop       =   420
   ClientWidth     =   6015
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   5025
   ScaleWidth      =   6015
   Begin VB.TextBox Text1 
      Enabled         =   0   'False
      Height          =   285
      Index           =   16
      Left            =   1440
      TabIndex        =   29
      Text            =   "Text1"
      Top             =   240
      Width           =   1095
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   15
      Left            =   1440
      TabIndex        =   28
      Text            =   "Text1"
      Top             =   4560
      Width           =   375
   End
   Begin VB.TextBox Text1 
      Enabled         =   0   'False
      Height          =   285
      Index           =   14
      Left            =   1440
      TabIndex        =   14
      Text            =   "Text1"
      Top             =   4200
      Width           =   1095
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   13
      Left            =   1440
      TabIndex        =   13
      Text            =   "Text1"
      Top             =   3840
      Width           =   1095
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   12
      Left            =   1440
      TabIndex        =   12
      Text            =   "Text1"
      Top             =   3480
      Width           =   1095
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   11
      Left            =   3960
      TabIndex        =   11
      Text            =   "Text1"
      Top             =   3120
      Width           =   1815
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   10
      Left            =   1440
      TabIndex        =   10
      Text            =   "Text1"
      Top             =   3120
      Width           =   1695
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   9
      Left            =   1440
      TabIndex        =   9
      Text            =   "Text1"
      Top             =   2760
      Width           =   1575
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   8
      Left            =   1440
      TabIndex        =   8
      Text            =   "Text1"
      Top             =   2400
      Width           =   1095
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   7
      Left            =   2640
      TabIndex        =   7
      Text            =   "Text1"
      Top             =   2040
      Width           =   3135
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   6
      Left            =   1440
      TabIndex        =   6
      Text            =   "Text1"
      Top             =   2040
      Width           =   1095
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   5
      Left            =   2640
      TabIndex        =   5
      Text            =   "Text1"
      Top             =   1680
      Width           =   3135
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   4
      Left            =   1440
      TabIndex        =   4
      Text            =   "Text1"
      Top             =   1680
      Width           =   1095
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   3
      Left            =   2640
      TabIndex        =   3
      Text            =   "Text1"
      Top             =   1320
      Width           =   3135
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   2
      Left            =   1440
      TabIndex        =   2
      Text            =   "Text1"
      Top             =   1320
      Width           =   1095
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   1
      Left            =   1440
      TabIndex        =   1
      Text            =   "Text1"
      Top             =   960
      Width           =   1095
   End
   Begin VB.TextBox Text1 
      Enabled         =   0   'False
      Height          =   285
      Index           =   0
      Left            =   1440
      TabIndex        =   0
      Text            =   "Text1"
      Top             =   600
      Width           =   1095
   End
   Begin KewlButtonz.KewlButtons Modificar 
      Height          =   495
      Left            =   3720
      TabIndex        =   31
      Top             =   4080
      Width           =   1335
      _ExtentX        =   2355
      _ExtentY        =   873
      BTYPE           =   1
      TX              =   "Modificar"
      ENAB            =   -1  'True
      BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      COLTYPE         =   2
      FOCUSR          =   -1  'True
      BCOL            =   4210752
      BCOLO           =   4210752
      FCOL            =   14737632
      FCOLO           =   16777215
      MCOL            =   4210752
      MPTR            =   1
      MICON           =   "ConsultaViajes.frx":0000
      PICN            =   "ConsultaViajes.frx":001C
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Viaje Nro:"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   285
      Index           =   13
      Left            =   0
      TabIndex        =   30
      Top             =   240
      Width           =   1455
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Facturado"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   285
      Index           =   12
      Left            =   0
      TabIndex        =   27
      Top             =   4560
      Width           =   1455
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "SubTotal"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   285
      Index           =   11
      Left            =   0
      TabIndex        =   26
      Top             =   4200
      Width           =   1455
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Tarifa"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   285
      Index           =   10
      Left            =   0
      TabIndex        =   25
      Top             =   3840
      Width           =   1455
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Kilos"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   285
      Index           =   9
      Left            =   0
      TabIndex        =   24
      Top             =   3480
      Width           =   1455
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Destino"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   285
      Index           =   8
      Left            =   3240
      TabIndex        =   23
      Top             =   3120
      Width           =   1455
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Procedencia"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   285
      Index           =   7
      Left            =   0
      TabIndex        =   22
      Top             =   3120
      Width           =   1455
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Mercaderia"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   285
      Index           =   6
      Left            =   0
      TabIndex        =   21
      Top             =   2760
      Width           =   1455
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Remito Nro"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   285
      Index           =   5
      Left            =   0
      TabIndex        =   20
      Top             =   2400
      Width           =   1455
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Chofer"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   285
      Index           =   4
      Left            =   0
      TabIndex        =   19
      Top             =   2040
      Width           =   1455
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Fletero"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   285
      Index           =   3
      Left            =   0
      TabIndex        =   18
      Top             =   1680
      Width           =   1455
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Empresa"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   285
      Index           =   1
      Left            =   0
      TabIndex        =   17
      Top             =   1320
      Width           =   1455
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Fecha Viajes"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   285
      Index           =   0
      Left            =   0
      TabIndex        =   16
      Top             =   960
      Width           =   1455
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Liquidación"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   285
      Index           =   2
      Left            =   0
      TabIndex        =   15
      Top             =   600
      Width           =   1455
   End
End
Attribute VB_Name = "ConsultaViajes"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private Sub Modificar_Click()
On Error Resume Next
Set rsViajesFact = db.OpenRecordset("Select * From LiqDetViajes Where NroViaje = " & ConsNroViaje & "")
rsViajesFact.Edit
rsViajesFact!CodEmpresa = Text1(2)
rsViajesFact!DescEmpresa = Text1(3)
rsViajesFact!CodChofer = Text1(6)
rsViajesFact!DescChofer = Text1(7)
rsViajesFact!mERCADERIA = Text1(9)
rsViajesFact!pROCEDENCIA = Text1(10)
rsViajesFact!dESTINO = Text1(11)
rsViajesFact!kilos = Text1(12)
rsViajesFact!tarifa = Text1(13)
rsViajesFact!NroRemito = Text1(8)
rsViajesFact!Fecha = Text1(1)
rsViajesFact!sUBTOTAL = Text1(14)
rsViajesFact!Facturado = Text1(15)
rsViajesFact!codflet = Text1(4)
rsViajesFact.Update
'Set rsLiqDetViajes = db.OpenRecordset("Select * From LiqDetViajes Where NroViaje = " & Text1(16) & "")
'rsLiqDetViajes.Edit
'rsLiqDetViajes!Facturado = Text1(15)
'rsLiqDetViajes.Update
With ModificaTarifa
    Set rsViajesFact = db.OpenRecordset("SELECT * FROM LiqDetViajes WHERE CodEmpresa = " & .Text1(0) & " ORDER BY Fecha")
    If Not rsViajesFact.EOF And Not rsViajesFact.BOF Then
        .ListaViajes.ListItems.Clear
        Do While Not rsViajesFact.EOF
            Set Lista = .ListaViajes.ListItems.Add(, , rsViajesFact!Fecha)
                Lista.Tag = rsViajesFact!Fecha
                Lista.SubItems(1) = rsViajesFact!NroRemito
                Lista.SubItems(2) = rsViajesFact!DescChofer
                Lista.SubItems(3) = rsViajesFact!mERCADERIA
                Lista.SubItems(4) = rsViajesFact!pROCEDENCIA
                Lista.SubItems(5) = rsViajesFact!dESTINO
                Lista.SubItems(6) = FormatNumber(rsViajesFact!kilos)
                Lista.SubItems(7) = FormatNumber(rsViajesFact!tarifa)
                Lista.SubItems(8) = FormatNumber(rsViajesFact!sUBTOTAL)
                Lista.SubItems(9) = rsViajesFact!codflet
                Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsViajesFact!codflet & "")
                Lista.SubItems(10) = rsFleteros!DescFlet
                Set rsFleteros = Nothing
                Lista.SubItems(11) = rsViajesFact!CodEmpresa
                Lista.SubItems(12) = rsViajesFact!CodChofer
                Lista.SubItems(13) = rsViajesFact!NroViaje
                Lista.SubItems(14) = rsViajesFact!NroLiq
                Lista.SubItems(15) = rsViajesFact!Facturado
                rsViajesFact.MoveNext
        Loop
    End If
End With
Unload Me
End Sub

Private Sub Text1_LostFocus(Index As Integer)
Dim tarifa As Double, kilos As Double
If Not Text1(12) = "" Then
    kilos = Text1(12)
End If
If Not Text1(13) = "" Then
tarifa = Text1(13)
End If
Select Case Index
    Case 12:
        Text1(14) = FormatNumber((kilos / 1000) * tarifa)
        Text1(12) = FormatNumber(Text1(12))
    Case 13:
        Text1(14) = FormatNumber((kilos / 1000) * tarifa)
        Text1(13) = FormatNumber(Text1(13))
    Case 2:
        Set rsEmpresas = db.OpenRecordset("Select * From Empresas Where CodEmpresas = " & Text1(2) & "")
        Text1(3) = rsEmpresas!DescEmpresas
        Set rsEmpresas = Nothing
    Case 4:
        Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & Text1(4) & "")
        Text1(5) = rsFleteros!DescFlet
        Set rsFleteros = Nothing
    Case 6:
        Set rsChoferes = db.OpenRecordset("Select * From Choferes Where CodChoferes = " & Text1(6) & " And Codflet = " & Text1(4) & "")
        Text1(7) = rsChoferes!AyN
    Case 15:
        If Not UCase(Text1(15)) = "SI" And Not UCase(Text1(15)) = "NO" Then
                MsgBox "Debe completar con SI o NO"
                Text1(15) = ""
                Text1(15).SetFocus
        Else
            Text1(15) = UCase(Text1(15))
        End If
End Select
End Sub
